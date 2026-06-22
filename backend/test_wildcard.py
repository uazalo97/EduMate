import os
import win32com.client

doc_path = os.path.abspath(r"temp\Phu_luc_4_Mau_Ke_hoach_bai_day.docx")
test_out = os.path.abspath(r"temp\test_tagged.docx")

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
try:
    doc = word.Documents.Open(doc_path)
    
    counter = 1
    patterns = [r"[.]{3,}", r"[_]{3,}", r"[…]{2,}"]
    
    for base_pattern in patterns:
        for separator in [",", ";"]:
            pattern = base_pattern.replace(",", separator)
            
            word.Selection.HomeKey(Unit=6)
            find = word.Selection.Find
            find.ClearFormatting()
            find.Text = pattern
            find.MatchWildcards = True
            find.Wrap = 0 # wdFindStop
            
            # Try to execute once to test syntax
            try:
                success = find.Execute()
            except Exception as e:
                # Invalid syntax (e.g. wrong list separator)
                continue
                
            # Reset and replace all
            word.Selection.HomeKey(Unit=6)
            while find.Execute():
                word.Selection.Text = f"{{{{ field_{counter} }}}}"
                word.Selection.Collapse(Direction=0)
                counter += 1
                
    doc.SaveAs2(test_out, FileFormat=16)
    doc.Close()
    print(f"Success! Replaced {counter-1} fields.")
except Exception as e:
    print("Error:", str(e))
finally:
    word.Quit()
